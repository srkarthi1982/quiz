import type { DomainMapping } from "../lib/types";
const environment: string = import.meta.env.ENVIRONMENT || 'DEV';
export const getDomain = function (): string {
    const domainMapping: DomainMapping = {
        'DEV': 'localhost',
        'PROD': 'quiz.institute'
    };
    return domainMapping[environment];
}
