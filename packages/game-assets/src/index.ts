import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from "@elysiajs/cors"
import { upload, requestBody } from './routes/upload' // Import requestBody

new Elysia()
    .use(swagger())
    .use(cors())
    // Explicitly use the requestBody schema for validation and Swagger documentation
    .post('/upload', ({ body }) => upload(body as any), { 
      body: requestBody 
    })
    .listen(3000)

console.log('Server is running on http://localhost:3000/swagger')