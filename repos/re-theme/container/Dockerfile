# Allows overwriting where the base image is pulled from
# Must come before the FROM directive
ARG KEG_NODE_VERSION
ARG GIT_STAGE_IMAGE_FROM=node:$KEG_NODE_VERSION
ARG KEG_IMAGE_FROM=keg-base:latest
FROM $KEG_IMAGE_FROM as builder

WORKDIR /

# Add npm-run-all globally
RUN yarn global add npm-run-all

# Should we use the local copy of the tap repo when building
ARG KEG_COPY_LOCAL

# Path of the app within the docker container
ARG DOC_APP_PATH=/keg/tap

# Copy over the app to a temp directory
COPY . /keg-temp/

# Update the build steps git config to include the key
# Pull down the tap locally if a git tap url exists
# Otherwise copy over the local version from keg-temp
RUN git config --global url.https://$PUBLIC_GIT_KEY@github.com/.insteadOf https://github.com/; \
    if [ -z "$KEG_COPY_LOCAL" ] && [ "$GIT_APP_URL" != "INITIAL" ]; then \
      git clone $GIT_APP_URL $DOC_APP_PATH; \
    else \
      cp -R /keg-temp/ $DOC_APP_PATH; \
    fi; \
    rm -rf /keg-temp

# Copy over the package.json, and yarn.lock files
COPY package.json $DOC_APP_PATH/package.json
COPY *.lock $DOC_APP_PATH/

# Install the dependecies with yarn setup, then remove the .npmrc
RUN cd $DOC_APP_PATH; \
    yarn install --ignore-engines; \
    yarn cache clean; \
    rm -f .npmrc


# ------- New Build Stage ------- #

# Use a multi stage build for security
# This is so PUBLIC_GIT_KEY is not accessable in the final image
FROM $GIT_STAGE_IMAGE_FROM as gitBuilder
WORKDIR /


# Path of the app within the docker container
ARG DOC_APP_PATH=${DOC_APP_PATH:-/keg/tap}
ARG KEG_PROXY_PORT=${KEG_PROXY_PORT:-5000}

# Get the ip of docker-machine from the ARG, so we can set it as an ENV
ARG KEG_DOCKER_IP

# Used by react native builder to set the ip address, other wise 
# Will use the ip address of the docker container.
ENV REACT_NATIVE_PACKAGER_HOSTNAME $KEG_DOCKER_IP

# Install git for the new stage
RUN apk add --no-cache git bash sudo; \
    echo fs.inotify.max_user_watches=1048576 | sudo tee -a /etc/sysctl.conf; \
    sudo sysctl -p; \
    git config --global url.https://$PUBLIC_GIT_KEY@github.com/.insteadOf https://github.com/; \
    rm -rf /var/cache/apk/*; \
    /bin/sed -i '1s|.*|root:x:0:0:root:/root:/bin/bash|g' /etc/passwd

# Copy over the globally installed modules from above
COPY --from=builder /usr/local/share/.config/yarn /usr/local/share/.config/yarn
# Add yarn's global bin to PATH
ENV PATH=$PATH:/usr/local/share/.config/yarn/global/node_modules/.bin

# Copy over the cloned app
COPY --from=builder $DOC_APP_PATH $DOC_APP_PATH

EXPOSE $KEG_PROXY_PORT
# Set the current directory to tap repo
WORKDIR $DOC_APP_PATH

SHELL [ "/bin/bash", "-c" ]

SHELL [ "/bin/bash" ]

# Run the start script
CMD [ "/bin/bash", "container/run.sh" ]
