#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OhioFitStack } from '../lib/ohio-fit-stack';

const app = new cdk.App();
new OhioFitStack(app, 'OhioFitStack', {});
