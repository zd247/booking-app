import { Migration } from '@mikro-orm/migrations';

export class Migration20210521071350 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("_id" serial primary key, "username" text not null, "password" text not null);');
    this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');

    this.addSql('create table "post" ("_id" serial primary key, "title" text not null);');
  }

}
