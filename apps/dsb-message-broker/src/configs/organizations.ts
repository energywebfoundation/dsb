export default () => ({
    ORGANIZATIONS: [
        {
            name: 'energyweb',
            apps: [
                {
                    name: 'dsb',
                    channels: '^[a-zA-Z0-9]{1,16}$',
                    roles: {
                        messageBroker: ['messagebroker'],
                        channelCreator: ['channelcreation'],
                        user: ['user']
                    }
                }
            ]
        }
    ]
});
