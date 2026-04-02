export class KafkaUtility {
  static getTopicFromEvent(event: string, env: string): string {
    let topic = '';
    if (env) {
      topic += env + '.';
    }
    topic += event;
    return topic;
  }
}
