import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3, aws_dynamodb as dynamodb, aws_lambda as lambda, aws_apigateway as apigw, aws_logs as logs } from 'aws-cdk-lib';

export class OhioFitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 buckets: raw (xlsx/csv) and processed (parquet)
    const rawBucket = new s3.Bucket(this, 'RawDataBucket', {
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const processedBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // DynamoDB cache for aggregates (peer means/medians, etc.)
    const aggregatesTable = new dynamodb.Table(this, 'AggregatesTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      tableClass: dynamodb.TableClass.STANDARD,
    });

    // Stubbed Lambda for profile endpoint (replace with real code later)
    const profileFn = new lambda.Function(this, 'ProfileFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(
        "exports.handler=async(e)=>({statusCode:200,headers:{'content-type':'application/json','cache-control':'public, max-age=300'},body:JSON.stringify({ok:true, route:'profile', input:e})});"
      ),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        TABLE_NAME: aggregatesTable.tableName,
        PROCESSED_BUCKET: processedBucket.bucketName,
      },
    });

    aggregatesTable.grantReadData(profileFn);
    processedBucket.grantRead(profileFn);

    // API Gateway with basic resources and caching
    const api = new apigw.RestApi(this, 'OhioFitApi', {
      restApiName: 'Ohio FIT API',
      deployOptions: {
        stageName: 'prod',
        cachingEnabled: true,
        cacheClusterEnabled: true,
        cacheClusterSize: '0.5',
        metricsEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        throttlingBurstLimit: 200,
        throttlingRateLimit: 100,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: ['GET','HEAD','OPTIONS'],
      },
    });

    const governments = api.root.addResource('governments');
    const govId = governments.addResource('{id}');
    const profile = govId.addResource('profile');
    profile.addMethod('GET', new apigw.LambdaIntegration(profileFn), {
      methodResponses: [{ statusCode: '200' }],
      apiKeyRequired: false,
    });

    // Health endpoint
    const healthFn = new lambda.Function(this, 'HealthFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline("exports.handler=async()=>({statusCode:200,body:'ok'});"),
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });
    api.root.addResource('health').addMethod('GET', new apigw.LambdaIntegration(healthFn), {
      methodResponses: [{ statusCode: '200' }],
    });

    new cdk.CfnOutput(this, 'RawBucketName', { value: rawBucket.bucketName });
    new cdk.CfnOutput(this, 'ProcessedBucketName', { value: processedBucket.bucketName });
    new cdk.CfnOutput(this, 'AggregatesTableName', { value: aggregatesTable.tableName });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
