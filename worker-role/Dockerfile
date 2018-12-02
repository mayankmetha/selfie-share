FROM node:8
WORKDIR /usr/src/selfie-share
# Copy contents of the current folder, into the docker container.
# All except the folders/files specified in the .dockerignore file are copied
COPY . .

RUN npm install
RUN npm run build

# Hack: Looks like within the container, tsc does not generate files within a "src" folder, as it does
# generally. Artificially create the src folder, and copy all the files into it.
#RUN mkdir tmp_src
#RUN mv build/* tmp_src
#RUN mv tmp_src build/src

#RUN npm run post-build

EXPOSE 3001
CMD ["npm", "start"]
