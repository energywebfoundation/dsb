export const extractFqcn = (fqcn: string) => {
    let parts = fqcn.split('.');
    if (
        parts.length !== 7 ||
        parts[1] !== 'channels' ||
        parts[3] !== 'apps' ||
        parts[5] !== 'iam' ||
        parts[6] !== 'ewc'
    )
        parts = new Array(7).fill(undefined);

    return {
        channel: parts[0],
        app: parts[2],
        org: parts[4]
    };
};
