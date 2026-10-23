import { join } from 'node:path'

export default () => ({
    email: {
        transport: 'smtp',
        defaults: {
            from: '',
        },
        template: {
            dir: join(import.meta.dirname, '../templates/email'),
            adapter: '',
        },
    },
})
