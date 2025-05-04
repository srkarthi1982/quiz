import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { actions } from 'astro:actions';

class Questions extends StoreBase {
  static #item = {
    id: 0,
    q: '',
    o: ['', '', '', ''],
    a: 0,
    e: '',
    l: 'E',
    platform_id: 0,
    subject_id: 0,
    topic_id: 0,
    roadmap_id: 0,
    is_active: true
  };

  static #filters = {
    q: '',
    e: '',
    l: '',
    is_active: '',
    platform_id: 32,
    subject_id: '',
    topic_id: '',
    roadmap_id: ''
  };

  static #sorting = { sort: 'id', order: true };

  static #columns = [
    { label: 'Id', value: 'id', operator: 'eq' },
    { label: 'Question', value: 'q', operator: 'ilike' },
    { label: 'Explanation', value: 'e', operator: 'ilike' },
    { label: 'Platform', value: 'platform_id', operator: 'eq' },
    { label: 'Subject', value: 'subject_id', operator: 'eq' },
    { label: 'Topic', value: 'topic_id', operator: 'eq' },
    { label: 'Roadmap', value: 'roadmap_id', operator: 'eq' },
    { label: 'Level', value: 'l', operator: 'eq' },
    { label: 'Active', value: 'is_active', operator: 'eq' }
  ];

  static #list = {
    platforms: [],
    subjects: [],
    topics: [],
    roadmaps: [],
    levels: [
      { id: 'E', name: 'Easy' },
      { id: 'M', name: 'Medium' },
      { id: 'D', name: 'Difficult' }
    ]
  };

  constructor() {
    super('public', 'Questions', 'Question', 'questions', 'questions', Questions.#item, Questions.#filters, Questions.#sorting, '*', Questions.#columns);
    this.publicColumns = Questions.#columns.filter(x => x.label === 'Question');
    this.column = { ...Questions.#list };
    this.form = { ...Questions.#list };
  }

  async onInit() {
    this.filters = { ...Questions.#filters };
    this.sorting = { ...Questions.#sorting };
    this.pagination = { ...this.defaultPagination, take: 5 };
    this.getData();
    this.getPlatforms();
  }

  async getPlatforms() {
    Alpine.store('loader').show();
    const { data, error } = await actions.getResult({ schema: this.schema, table: 'platforms', fields: 'id, name', match: { is_active: true }, order: 'name' });
    Alpine.store('loader').hide();
    if (error) return;
    this.column = { ...this.column, platforms: data };
    this.form = { ...this.form, platforms: data };
  }

  async getSubjects(platform_id) {
    Alpine.store('loader').show();
    const { data, error } = await actions.getResult({ schema: this.schema, table: 'subjects', fields: 'id, name', match: { platform_id, is_active: true }, order: 'name' });
    Alpine.store('loader').hide();
    if (error) return;
    return data;
  }

  async getTopics(subject_id) {
    Alpine.store('loader').show();
    const { data, error } = await actions.getResult({ schema: this.schema, table: 'topics', fields: 'id, name', match: { subject_id, is_active: true }, order: 'name' });
    Alpine.store('loader').hide();
    if (error) return;
    return data;
  }

  async getRoadmaps(topic_id) {
    Alpine.store('loader').show();
    const { data, error } = await actions.getResult({ schema: this.schema, table: 'roadmaps', fields: 'id, name', match: { topic_id, is_active: true }, order: 'id' });
    Alpine.store('loader').hide();
    if (error) return;
    return data;
  }

  async onSave() {
    // Alpine.store('loader').show();
    const { id, q, o, a, e, l, platform_id, subject_id, topic_id, roadmap_id, is_active } = this.item;
    await this.closeDrawer(id, { q, o, a, e, l, platform_id, subject_id, topic_id, roadmap_id, is_active });
  }

  onInsert() {
    this.form.subjects = [];
    this.form.topics = [];
    this.form.roadmaps = [];
    this.item = { ...Questions.#item };
    this.openDrawer({ ...Questions.#item });
  }

  async onEdit(item) {
    this.form.subjects = await this.getSubjects(Number(item.platform_id));
    this.form.topics = await this.getTopics(Number(item.subject_id));
    this.form.roadmaps = await this.getRoadmaps(Number(item.topic_id));
    this.openDrawer({ ...item });
    this.item = {
      ...item,
      subject_id: Number(item.subject_id),
      topic_id: Number(item.topic_id),
      roadmap_id: Number(item.roadmap_id)
    };
  }

  async onGenerateQuestions() {
          Alpine.store("loader").show();
          const { platform_id, subject_id, topic_id, roadmap_id, l } = this.filters;
          const numQuestions = 40;
          const platform = this.column.platforms.find(x => x.id === platform_id);
          const subject = this.column.subjects.find(x => x.id === subject_id);
          const topic = this.column.topics.find(x => x.id === topic_id);
          const roadmap = this.column.roadmaps.find(x => x.id === roadmap_id);
          const level = this.column.levels.find(x => x.id === l);
          const { data, error } = await actions.generateQuestion({ numQuestions, platform, subject, topic, roadmap, level });
          Alpine.store("loader").hide();
          if (error) {
              alert(JSON.stringify(error));
              Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
              return;
          }
          if (data.success) this.getData();
      }
      async onVerify() {
          Alpine.store("loader").show();
          const match = { platform_id: this.filters.platform_id, l: this.filters.l, is_active: false };
          const response = await actions.getResult({ schema: this.schema, table: 'questions', fields: 'id, q, o', match, order: 'id' });
          const questions = response.data;
          if (!questions?.length) {
              Alpine.store("loader").hide();
              Alpine.store("toast").show("No questions found for verification.", "info");
              return;
          }
      
          const promises = questions.map(q => {
              return actions.verifyQuestion({
                  id: q.id,
                  question: q.q,
                  options: q.o
              })
              .then(res => {
                  console.log(`Verified question ${q.id}:`, res);
              })
              .catch(error => {
                  console.error(`Failed to verify question ${q.id}`, error);
                  Alpine.store("toast").show(`Error verifying question ${q.id}`, "error");
              });
          });
      
          try {
              await Promise.all(promises);
              Alpine.store("toast").show("All questions verified successfully!", "success");
          } catch (error) {
              Alpine.store("toast").show("Some questions failed to verify.", "warning");
          } finally {
              Alpine.store("loader").hide();
          }
      }    
      async onBulk() {
          Alpine.store("loader").show();
          const { platform_id, l } = this.filters;
          const level_param = l;
          console.log('platform_id', platform_id)
          console.log('l', l)
          const response = await actions.getFunctions({
              schema: this.schema,
              name: 'get_empty_roadmaps',
              match: { platform_id_param: platform_id, level_param }
          });
      
          if (!response?.data?.length) {
              Alpine.store("loader").hide();
              Alpine.store('toast').show('No empty roadmaps found.', 'info');
              return;
          }
      
          const promises = response.data.map((o) => {
              const numQuestions = 40;
              const platform = { id: o.platform_id, name: o.platform_name };
              const subject = { id: o.subject_id, name: o.subject_name };
              const topic = { id: o.topic_id, name: o.topic_name };
              const roadmap = { id: o.id, name: o.name };
              const level = { id: level_param, name: level_param };
      
              return actions.generateQuestion({ numQuestions, platform, subject, topic, roadmap, level })
                  .then(({ error }) => {
                      if (error) {
                          throw new Error(error.issues?.length > 0 ? error.issues[0].message : error.message);
                      }
                      console.log('Generated:', { numQuestions, platform, subject, topic, roadmap, level });
                  });
          });
      
          try {
              await Promise.all(promises);
              Alpine.store('toast').show('All questions generated successfully!', 'success');
          } catch (error) {
              //alert(error.message);
              Alpine.store('toast').show(error.message, 'error');
          } finally {
              Alpine.store("loader").hide();
          }
       }
}

Alpine.store('questions', new Questions());
