export const extractFqcn = (fqcn: string) => {
    const parts = fqcn.split('.');
    return {
        channel: parts[0],
        app: parts[2],
        org: parts[4]
    };
};
