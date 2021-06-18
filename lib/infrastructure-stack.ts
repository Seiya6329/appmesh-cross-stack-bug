import * as cdk from '@aws-cdk/core';
import * as appmesh from '@aws-cdk/aws-appmesh';

export class InfrastructureStack extends cdk.Stack {
  public readonly mesh: appmesh.Mesh;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    this.mesh = new appmesh.Mesh(this, "Mesh", {
      meshName: 'cdkbug',
      egressFilter: appmesh.MeshFilterType.DROP_ALL
    });
  }
}
