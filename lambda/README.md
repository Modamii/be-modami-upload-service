### Build & validate SAM template
```
sam build

sam validate
```


### Deploy command

```
sam deploy --config-env <env-name> --profile <aws-profile-name-on-local-pc>

ex: sam deploy --config-env staging --profile modami-staging
```

More info about SAM & SAM cli: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

### In case first deploy on specific AWS Account
1. Run command:
```
sam deploy --guided --profile <aws-profile-name-on-local-pc>
```
2. Input param:
- Stack name: use stack name in file `samconfig.toml`, add suffix when deploy multiple stack on the same AWS account
- AWS Region: use AWS Region in file `samconfig.toml`
- Confirm changes before deploy: y
- Allow SAM CLI IAM role creation: y
- Disable rollback: N
- Save arguments to configuration file: y
- SAM configuration file [samconfig.toml]: choose default
- SAM configuration environment: put env name (ex: production). This option will save the configuration (include SAM cli managed S3 bucket) into config file `samconfig.toml`. The next deploy, we can use non-guided command in [Deploy command] section above.


Note: 
- Remove the profile option in the new env added section in file `samconfig.toml`. Because, the profile will be different on each machine or CICD flow using role instead of profile.
- Commit the new env config to git for the next deployment use.
