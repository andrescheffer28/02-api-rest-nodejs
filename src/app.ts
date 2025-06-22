import fastify from "fastify";
import cookie from '@fastify/cookie'
import { transactionsRoutes } from "./routes/transactios";


export const app = fastify();

app.register(cookie)
app.register(transactionsRoutes, {
  prefix: 'transactions',
})