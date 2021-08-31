import { Module } from '@nestjs/common';
import { AddressBookService } from './addressbook.service';

@Module({
    providers: [AddressBookService],
    exports: [AddressBookService]
})
export class AddressBookModule {}
