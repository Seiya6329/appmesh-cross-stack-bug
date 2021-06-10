#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { MeshedServiceStack } from '../lib/meshed-service-stack';

const app = new cdk.App();
const infra = new InfrastructureStack(app, 'InfrastructureStack', {
    MeshName: "cdkbug",
    CloudMapNamespace: "cdkbug.local"
});

const svc = new MeshedServiceStack(app, 'MeshedServiceStack', {
    vpc: infra.vpc,
    cluster: infra.cluster,
    serviceName: "echo",
    serviceImage: ecs.ContainerImage.fromRegistry("hashicorp/http-echo"),
    containerPort: 5678,
    MeshName: "cdkbug",
})