import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from "@elysiajs/cors"
import { upload } from './routes/upload'

new Elysia()
    .use(swagger())
    .use(cors())
    .post('/upload', upload)
    .listen(3000)

console.log('Server is running on http://localhost:3000/swagger')