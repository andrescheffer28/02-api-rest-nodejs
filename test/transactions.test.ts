import { expect, test, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

// forma de categorizar os testes
// pode ser criado subcategorias
describe('Transactions routes', () => {
    beforeAll(async() => {
        await app.ready()
    })

    afterAll(async() => {
        await app.close()
    })

    beforeEach(()=>{
        execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })

    test('user can create a new transaction', async () => {

        await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit',
            })
            .expect(201)
    })

    test('user should be able to list all transactions', async () => {
        //todo test deve obrigatoriamente se excluir de qualque contexto, 
        // logo n há interações entre tests. Um test n pode depender de outro test
        // se depender, eles deveriam ser uma coisa só

        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit',
            })
            .expect(201)
        
        const cookies = createTransactionResponse.get('Set-Cookie')

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)//enviando o cabeçalho de cookies com os cookies
            .expect(200)

        //verificar que os dados da transação criada estão contidas na listagem de transações 
        expect(listTransactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000,
            })
        ])
    })

    test('user should be able to get a specific transaction', async () => {

        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit',
            })
            .expect(201)
        
        const cookies = createTransactionResponse.get('Set-Cookie')

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)

            const transactionId = listTransactionsResponse.body.transactions[0].id

        const getTransactionResponse = await request(app.server)
            .get(`/transactions/${transactionId}`)
            .set('Cookie', cookies)
            .expect(200)

        expect(getTransactionResponse.body.transaction).toEqual(
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000,
            })
        )
    })

    test('user should be able to get the summary', async () => {

        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'Credit transaction',
                amount: 5000,
                type: 'credit',
            })
        
        const cookies = createTransactionResponse.get('Set-Cookie')

        await request(app.server)
            .post('/transactions')
            .set('Cookie', cookies)
            .send({
                title: 'Debit transaction',
                amount: 5000,
                type: 'debit',
            })

        const summaryResponse = await request(app.server)
            .get('/transactions/summary')
            .set('Cookie', cookies)
            .expect(200)

        expect(summaryResponse.body.summary).toEqual({
            amount: 0,
        })
    })
})