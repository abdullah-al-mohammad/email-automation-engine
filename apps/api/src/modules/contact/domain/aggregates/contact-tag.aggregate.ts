import { Entity, CreateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Contact } from './contact.aggregate';
import { Tag } from './tag.aggregate';

@Entity('contact_tags')
export class ContactTag {
  @PrimaryColumn({ type: 'uuid' })
  contactId!: string;

  @PrimaryColumn({ type: 'uuid' })
  tagId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Contact)
  @JoinColumn()
  contact?: Contact;

  @ManyToOne(() => Tag)
  @JoinColumn()
  tag?: Tag;
}
