import * as cdk from '@aws-cdk/core';
import {InfrastructureStack} from "../lib/infrastructure-stack";
import {MeshedServiceStack} from "../lib/meshed-service-stack";
import {SynthUtils} from "@aws-cdk/assert";

test('Empty Stack', () => {
  const app = new cdk.Stack();

  const infra = new InfrastructureStack(app, 'InfrastructureStack');

  const svc = new MeshedServiceStack(app, 'MeshedServiceStack', { mesh: infra.mesh })

  // When
  expect(SynthUtils.toCloudFormation(svc)).toMatchSnapshot();
});