import { Migration } from '@mikro-orm/migrations';

export class Migration20210517105355 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "post" ("_id" serial primary key, "title" text not null);');
  }

}
