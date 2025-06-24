import { t } from 'elysia'

export const requestBody = t.Object({
  file: t.Files(),
},{
  description: 'File to upload',
  required: true
})

export const upload = (body: {file: File}) => {
 
  if (!body || !body.file) {
    throw new Error("File is required for upload");
  }

  
  throw new Error("Invalid username or password");
};
