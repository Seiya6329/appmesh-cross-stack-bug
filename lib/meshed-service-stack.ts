import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecr from '@aws-cdk/aws-ecr';
import * as iam from '@aws-cdk/aws-iam';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as appmesh from '@aws-cdk/aws-appmesh';
import {Duration} from "@aws-cdk/aws-applicationautoscaling/node_modules/@aws-cdk/core";
import {Service} from "@aws-cdk/aws-servicediscovery";

interface MeshedServiceStackProps extends cdk.StackProps {
  vpc: ec2.IVpc,
  cluster: ecs.ICluster,
  serviceName: string,
  serviceImage: ecs.ContainerImage,
  containerPort: number,
  MeshName: "cdkbug"
}

export class MeshedServiceStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: MeshedServiceStackProps) {
    super(scope, id, props);

    var taskDef = new ecs.FargateTaskDefinition(this, "TaskDef", {
      cpu: 256,
      memoryLimitMiB: 512,
      proxyConfiguration: new ecs.AppMeshProxyConfiguration({
        containerName: 'envoy',
        properties: {
          appPorts: [props.containerPort],
          proxyEgressPort: 15001,
          proxyIngressPort: 15000,
          ignoredUID: 1337,
          egressIgnoredIPs: [
            '169.254.170.2',
            '169.254.169.254'
          ]
        }
      })
    });
    taskDef.taskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSAppMeshEnvoyAccess"));

    var envoyContainer = taskDef.addContainer("envoy", {
      image: ecs.ContainerImage.fromEcrRepository(ecr.Repository.fromRepositoryArn(this, "aws-appmesh-envoy", "arn:aws:ecr:us-east-1:840364872350:repository/aws-appmesh-envoy"), "v1.15.0.0-prod"),
      essential: true,
      environment: {
        APPMESH_VIRTUAL_NODE_NAME: `mesh/${props.MeshName}/virtualNode/${props.serviceName}`,
        AWS_REGION: cdk.Stack.of(this).region
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE'
        ],
        startPeriod: Duration.seconds(10),
        interval: Duration.seconds(5),
        timeout: Duration.seconds(2),
        retries: 3
      },
      memoryLimitMiB: 128,
      user: '1337',
    });

    var appContainer = taskDef.addContainer(props.serviceName, {
      image: props.serviceImage,
      cpu: 128,
      memoryLimitMiB: 128,
      essential: true,
    });
    appContainer.addPortMappings({
      containerPort: props.containerPort
    });
    appContainer.addContainerDependencies({
      container: envoyContainer,
      condition: ecs.ContainerDependencyCondition.HEALTHY
    });

    var securityGroup = new ec2.SecurityGroup(this, "securitygroup", {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: `Allow traffic from anywhere to ${appContainer.containerName} service`,
      securityGroupName: appContainer.containerName
    });
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(appContainer.containerPort),
      appContainer.containerName
    );

    var service = new ecs.FargateService(this, "service", {
      cluster: props.cluster,
      desiredCount: 1,
      assignPublicIp: false,
      taskDefinition: taskDef,
      securityGroup: securityGroup,
      cloudMapOptions: {
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
        failureThreshold: 2,
        name: props.serviceName
      }
    });
    git 
    const mesh = new appmesh.Mesh(this, "Mesh", {
      meshName: props.MeshName,
      egressFilter: appmesh.MeshFilterType.DROP_ALL
    });

    var virtualNode = mesh.addVirtualNode("${props.serviceName}-vn", {
      virtualNodeName: props.serviceName,
      serviceDiscovery: service.cloudMapService? appmesh.ServiceDiscovery.cloudMap({
        service: service.cloudMapService
        }): undefined,
      listeners: [appmesh.VirtualNodeListener.http({
        port: appContainer.containerPort,
      })],
    });

    var virtualRouter = mesh.addVirtualRouter("${props.serviceName}-vr", {
      virtualRouterName: "${props.serviceName}-vr",
      listeners: [appmesh.VirtualRouterListener.http(appContainer.containerPort)],
    });

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
