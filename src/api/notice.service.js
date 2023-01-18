class NoticeService {

    type = 'notice';

    constructor(prisma, baseUrl) {
        this.prisma = prisma;
        this.baseUrl = baseUrl;
    }

    async getById(id) {
        const notice = await this.prisma.noticeFinep.findUnique({
            where: {
                id
            }
        });

        return this._formatNotice(notice);
    }

    async getAll() {
        const notices = await this.prisma.noticeFinep.findMany();
        return notices.map(notice => this._formatNotice(notice));
    }

    _formatNotice(notice) {
        return {
            id: notice.id,
            type: this.type,
            attributes: {
                title: notice.title,
                description: notice.description,
                schedule: notice.schedule,
                source: {
                    uri: notice.uri
                }
            },
            links: {
                self: `${this.baseUrl}/notices/${notice.id}`
            }
        }
    }
}

module.exports.NoticeService = NoticeService;

