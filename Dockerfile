# base image
FROM debian

# update and install 
RUN apt-get update && apt-get install -y \
  tesseract-ocr

# set work dir
WORKDIR /tesseract

# set command
CMD ["tesseract", "--help-extra"]
