import aws from 'aws-sdk';

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: process.env.AWS_REGION
});

const uploadFile = async (file, worldId, res) => {
  const s3 = new aws.S3();
  const fileContent = Buffer.from(file.data, 'binary');

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: `${worldId}/${file.name}`,
    Body: fileContent
  };

  s3.upload(params, (err, data) => {
    if (err) {
      throw err;
    }
    res.send({
      "response_code": 200,
      "response_message": "Success",
      "response_data": data
    });
  });
};

export default uploadFile;
