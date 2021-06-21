NAME = energyweb/dsb-message-broker:canary

build-container:
	@rm -rf ./deployment
	@mkdir ./deployment
	@rush deploy -p @energyweb/dsb-message-broker -t ./deployment --overwrite
	@docker rmi ${NAME} -f
	@docker build -t ${NAME} -f Dockerfile ./deployment
	@rm -rf ./deployment


