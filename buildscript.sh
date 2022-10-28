docker buildx build --platform linux/amd64,linux/arm64 . -t damintsew/korona-api --push
docker build . -t damintsew/korona-api && docker push damintsew/korona-api


docker build . -t damintsew/korona-api && docker push damintsew/korona-api
