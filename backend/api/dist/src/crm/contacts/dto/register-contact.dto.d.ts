import { CreateContactDto } from './create-contact.dto';
declare const RegisterContactDto_base: import("@nestjs/mapped-types").MappedType<Pick<CreateContactDto, "address" | "phone" | "email" | "contactName" | "company">>;
export declare class RegisterContactDto extends RegisterContactDto_base {
    password: string;
    since?: Date;
}
export {};
