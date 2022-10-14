docker buildx build --platform linux/amd64,linux/arm64 . -t damintsew/korona-watcher-bot --push
docker build . -t damintsew/korona-watcher-bot && docker push damintsew/korona-watcher-bot


docker build . -t damintsew/korona-api && docker push damintsew/korona-api
