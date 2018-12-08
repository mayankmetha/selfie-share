# to start server
`npm install` //First time only, from the web-role and web-worker folder <br>
To start the Web Role REST server, run `cd web-role` <br>
`npm run build` <br>
`npm start` <br>
To start server in local mode (i.e. no uploads to cloud storage), run <br>
`LOCAL_ONLY=true npm start`<br><br>

To configure a port, start the server using <br>
`PORT=<port number> npm start`<br><br>

# to test rest api

`curl -X [GEP|POST|PUT|DELETE] localhost:3000/[rest of the path]`
<br>
OR
<br>
Start the server<br>
Navigate to 'http://localhost:3000/'<br>
Use the Swagger UI to run any of the REST APIs<br>
<br>
OR<br>
Run the command `npm run test`<br><br>
Adding new controllers:<br>
A sample implementation is in the "UserController" controller.<br>
<br>
Testing:
<br>
Uses mocha and chai for tests. Put all test files under the 'test' folder. Example test/users.test.ts. <br>
Running Tests <br>
Ensure Web-Role server is running <br>
Navigate to the "test" folder <br>
If not done, run `npm install` here as well <br>
Run `npm start`
<br>
Known Issues:<br>
Building sometimes fails with seg fault. Ignore for now. <br>
Tests are failing - which is expected. Some APIs need to be added in the BL, and the same need to be invoked in the tests before they can pass.<br>
Make sure to setup mysql locally. 
`sudo apt install mysql`<br>

Check dbcommands.txt for setting up the DB for the first time.<br>

References used:<br>
https://dev.to/briandgls/using-typescript-with-express--e0k<br>
https://www.rajram.net/node-101-part-4-auto-generate-and-register-routes-in-node-for-web-apis-2/<br>
https://www.rajram.net/node-101-part-5-auto-generate-swagger-for-your-web-api-and-use-swaggerui-to-try-it-out/<br>


# RELEASE 2: Docker containers <br>
<br>
# Instructions <br>
<br>
Installing mysql container: <br>
`sudo docker pull mysql/mysql-server:5.7` <br>
Start the mysql container: NOTE: Keep the container name the same, it is used as a config parameter <br>
`sudo docker run --name=mysql -d mysql/mysql-server:5.7` <br>
# Setup the mysql DB <br>
TODO: Automate this <br>
MySQL auto generates a password. Find it by running `sudo docker logs mysql1 2>&1 | grep GENERATED` <br>
Use the password to log into the mysql client: `sudo docker exec -it mysql1 mysql -uroot -p` <br>
Reset the MySQL password to "password": `ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';` <br>
Run the following commands: <br>
`CREATE USER 'root'@'%' IDENTIFIED BY 'password';` <br>
`GRANT ALL PRIVILEGES ON . TO 'root'@'%';` <br>
`FLUSH PRIVILEGES;` <br>
Setup the DB schema by running all commands in dbcommands.txt <br>

#The worker role needs internet access to upload images to S3 <br>
#Enable it by creating a file /etc/docker/daemon.json on your host, and add the following entry:
<br>
<code>
{
	"dns":
	[
	       	"8.8.8.8"
	]
}
</code>


# Building the container image
Build the docker image: Navigate to the web-role, and run `sudo docker build -t fsc/selfie-share-webrole .`<br>

Build the docker image: Navigate to worker-role, and run `sudo docker build -t fsc/selfie-share-webrole .`<br>

# Start all containers <br>
From the root folder of the project, Run `docker-compose up -d` (Install docker-compose first from the docker website)<br>

To Stop containers: `docker-compose down`

<br>
############ FOR REFERENCE ONLY  Section below won't be needed for now, at least ################## <br>
# NOTE: Port can be changed as needed, as can the names given to the network and the container <br>

Start the docker container: <br>
`sudo docker run -d --name selfie-share-webrole -p 3000:3000 --link mysql:mysql fsc/selfie-share-web-role` <br>
The server should be listening on port 3000 <br>

<br>
# Configuring the network
Setup bridge network: `docker network create docker-bridge` <br>
Configure Docker bridge network: `docker create --name fsc-bridge-nw --network docker-bridge --publish 3000:3000` <br>
Connect the docker container to the bridge network: `sudo docker network connect docker-bridge selfie-share` <br>
Get the IP address of the container running the application: `sudo docker network inspect docker-bridge` <br>

You can open the Swagger page by navigating to that IP <br>
<br>
List running containers: `sudo docker ps` <br>
Stopping the container: `sudo docker stop selfie-share` <br>
Remove the container: `sudo docker rm selfie-share` <br>

<br>
References:
Installing docker container engine on Ubuntu: https://docs.docker.com/install/linux/docker-ce/ubuntu/<br>
Creating a docker container for a NodeJS application: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/ <br>
Creating a bridge network to expose a running docker container port: https://docs.docker.com/network/bridge/#connect-a-container-to-a-user-defined-bridge <br>
<br>
