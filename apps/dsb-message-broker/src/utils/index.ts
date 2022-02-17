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

export const didComparison = (did1: string, did2: string) => {
    did1 = did1.includes('volta') ? did1 : did1.replace('ethr', 'ethr:volta');
    did2 = did2.includes('volta') ? did2 : did2.replace('ethr', 'ethr:volta');

    return did1 === did2;
};
