import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as appmesh from '@aws-cdk/aws-appmesh';

interface InfrastructureStackProps extends cdk.StackProps {
  MeshName: "cdkbug",
  CloudMapNamespace: "cdkbug.local"
}

export class InfrastructureStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  // public readonly mesh: appmesh.Mesh;

  constructor(scope: cdk.Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 3 // Default is all AZs in region
    });

    this.cluster = new ecs.Cluster(this, "Cluster", {
      vpc: this.vpc,
      defaultCloudMapNamespace: {
        name: props.CloudMapNamespace,
        type: servicediscovery.NamespaceType.DNS_PRIVATE,
        vpc: this.vpc
      }
    });
  }
}
