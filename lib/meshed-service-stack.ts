import * as cdk from '@aws-cdk/core';
import * as appmesh from '@aws-cdk/aws-appmesh';
import {Vpc} from "@aws-cdk/aws-ec2";

interface MeshedServiceStackProps extends cdk.StackProps {
  mesh: appmesh.IMesh,
}

export class MeshedServiceStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: MeshedServiceStackProps) {
    super(scope, id, props);

    // var virtualNode = props.mesh.addVirtualNode("${props.serviceName}-vn", {
    //   virtualNodeName: 'testVN',
    // });

    var virtualNode = new appmesh.VirtualNode(this, "${props.serviceName}-vn", {
      mesh: props.mesh,
      virtualNodeName: 'testVN',
    });

    var virtualRouter = props.mesh.addVirtualRouter("${props.serviceName}-vr", {
      virtualRouterName: "${props.serviceName}-vr",
    });

    // var virtualRouter = new appmesh.VirtualRouter(this, "${props.serviceName}-vr", {
    //   mesh: props.mesh,
    //   virtualRouterName: "${props.serviceName}-vr",
    // });

    var defaultRoute = virtualRouter.addRoute("${props.serviceName}-vr-route-default", {
      routeName: "default",
      routeSpec: appmesh.RouteSpec.http({
        weightedTargets:[
          {
            virtualNode: virtualNode,
            weight: 100
          },
        ],
      }),
    });
  }
}
