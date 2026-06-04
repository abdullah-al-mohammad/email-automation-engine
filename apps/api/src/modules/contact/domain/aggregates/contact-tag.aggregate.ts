import { Entity, CreateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Contact } from './contact.aggregate';
import { Tag } from './tag.aggregate';

@Entity('contact_tags')
export class ContactTag {
  @PrimaryColumn({ name: 'contact_id', type: 'uuid' })
  contactId!: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid' })
  tagId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @ManyToOne(() => Tag)
  @JoinColumn({ name: 'tag_id' })
  tag?: Tag;
}
