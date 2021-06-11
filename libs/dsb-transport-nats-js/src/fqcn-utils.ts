export const fqcnToStream = (fcqn: string): { stream: string; subject: string } => {
    const split = fcqn.split('.');
    const reversed = split.reverse();
    const stream = reversed.join('_');

    return {
        stream,
        subject: `${stream}.default`
    };
};
