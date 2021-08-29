export const fqcnToStream = (fcqn: string): { stream: string; subject: string } => {
    const split = fcqn.split('.');
    const reversed = split.reverse();
    const stream = reversed.join('_');

    return {
        stream,
        subject: `${stream}.default`
    };
};

export const getStreamName = (fqcn: string) => {
    const split = fqcn.split('.');
    const reversed = split.reverse();
    const stream = reversed.join('_');

    return stream;
};

export const getStreamSubjects = (stream: string, topics: any) => {
    let subjects = [`${stream}.default`];
    if (topics)
        subjects = [...subjects, ...topics.map((topic: any) => `${stream}.${topic.namespace}`)];

    return subjects;
};

export const getSubjectName = (fqcn: string, topic: string) => {
    const stream = getStreamName(fqcn);
    const subject = `${stream}.${topic}`;

    return subject;
};

export const streamToFqcn = (stream: string): string => {
    const split = stream.split('_');
    const reversed = split.reverse();
    const fqcn = reversed.join('.');
    return fqcn;
};
