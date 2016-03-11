FROM fedora:23

# Install npm
RUN dnf -yq install npm

# Set up the working directory and pull in everything in the local directory
# This assumes you build the docker image in the git repo directory
WORKDIR /frankly
ADD . /frankly

# Install bower and then install frankly
# Work around: everything in this container runs as root
RUN npm install -g bower
RUN bower install --allow-root

# Expose the port and run the web server
EXPOSE 8000
CMD ["python", "-m", "SimpleHTTPServer"]
