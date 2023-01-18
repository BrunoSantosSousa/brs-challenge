const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { NoticeService } = require('./notice.service');

const prisma = new PrismaClient()

const app = express()
const host = 'localhost';
const port = 3000

const noticeService = new NoticeService(prisma, `http://${host}:${port}`);

app.get('/notices/', async (req, res) => {
    const data = await noticeService.getAll();
    
    res.send({ data });
})

app.get('/notices/:id', async (req, res) => {
    const data = await noticeService.getById(req.params?.id);

    if (!data) {
        return res.send({
            message: 'Notice not found for requested id'
        });
    }

    res.send({data});
})

app.listen(port, async () => {
    await prisma.$connect();
    console.log(`API listening on port ${port}`)
})