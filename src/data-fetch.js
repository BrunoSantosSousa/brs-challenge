const Crawler = require('crawler');
const { PrismaClient } = require('@prisma/client')


const prisma = new PrismaClient()


function createCrawler(fnHandleRequest) {
    return new Crawler({
        maxConnections: 20,
        callback: (error, res, done) => {
            if (error) {
                console.log(error);
                done();
                return;
            }

            fnHandleRequest(res.$, res.options.uri);
            done();
        }
    });
}

const url_finep = 'http://www.finep.gov.br/chamadas-publicas/chamadaspublicas?pchave=&palvo%5B%5D=2&palvo%5B%5D=413&palvo%5B%5D=410&palvo%5B%5D=445&palvo%5B%5D=124&palvo%5B%5D=305&palvo%5B%5D=447&palvo%5B%5D=3&palvo%5B%5D=194&situacao=&d1=&d2=&task=&boxchecked=0&filter_order=ordering&filter_order_Dir=asc&244d29e486bd6a60a83cc459c3d057c9=1';
const url_detail_finep = 'http://www.finep.gov.br/chamadas-publicas/chamadapublica';

const local_data = {
    items: [],
    all_pages_fetched: false
}

function getItems($) {
    const content = $('#conteudoChamada');

    const items = [];
    
    content.find('.item').each(function (index){
        const href = $(this).find('a').attr('href');

        items.push({
            id: href.replace('/chamadas-publicas/chamadapublica/', ''),
            title: $(this).find('h3').text(),
            uri: 'http://www.finep.gov.br' + href,
            detail: false,
            schedule: {
                publication: $(this).find('.data_pub').find('span').text(),
                deadline: $(this).find('.prazo')?.find('span')?.text(),
            }
        })
    });

    return items;
}


function checkItemsHaveDetail() {
    if (!local_data.all_pages_fetched) {
        return;
    }

    if (local_data.items.every(item => !!item.detail)) {
        console.log('\nEvery notice was saved on mongo database\n');
    }
}

async function saveItem(item) {
    const { id, title, description, uri, schedule } = item;

    const data = {
        idFinep: parseInt(id),
        title,
        description,
        uri,
        schedule
    }

    await prisma.noticeFinep.upsert({
        where: { idFinep: data.idFinep },
        update: data,
        create: data
    });
}


function handleDetailCrawler($, uri) {
    const description = $('.desc').text();

    const id = uri.replace(`${url_detail_finep}/`, '');

    for (const item of local_data.items) {
        if (item.id === id) {
            item.description = description;
            item.detail = true;

            saveItem(item);
        }
    }

    checkItemsHaveDetail();
}

const detailCrawler = createCrawler(handleDetailCrawler);


function getPagination($) {
    const pagination = $('.pagination').find('.counter').text();

    const [ from, of ] = pagination.match(/(\d{1,3})/g);

    return {
        from: parseInt(from),
        of: parseInt(of)
    };
}

function createNextUrl(from) {
    const start = from * 10;
    return `${url_finep}&start=${start}`;
}

function handleListRequest($) {
    const currentItems = getItems($)
    
    for (const item of currentItems) {
        const url = `${url_detail_finep}/${item.id}`;
        console.log("Fetching details from ", item.id);
        detailCrawler.queue(url);
    }

    local_data.items.push(...currentItems);

    const { from, of } = getPagination($);

    if (from !== of) {
        console.log("Fetch page ", from + 1, ' of ', of);
        listCrawler.queue(createNextUrl(from))
    } else {
        local_data.all_pages_fetched = true;
    }

}

const listCrawler = createCrawler(handleListRequest);


async function fetch() {
    await prisma.$connect();

    console.log("Fetching data from first page");
    listCrawler.queue(url_finep);
}


module.exports.fetch = fetch;