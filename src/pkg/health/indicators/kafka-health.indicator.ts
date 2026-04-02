import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator } from '@nestjs/terminus';
import { Consumer } from '@nestjs/microservices/external/kafka.interface';
import { HealthIndicatorResult } from '@nestjs/terminus/dist/health-indicator';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  private _lastHeartbeat;
  private _consumer: Consumer;
  private readonly _sessionTimeout = 30000;

  public startCheck(consumer: Consumer): void {
    this._consumer = consumer;
    const { HEARTBEAT } = this._consumer.events;
    this._consumer.on(
      HEARTBEAT,
      ({ timestamp }) => (this._lastHeartbeat = timestamp),
    );
  }

  public async isHealthy(key: string): Promise<HealthIndicatorResult> {
    if (!this._consumer) {
      const exMessage = 'Kafka consumer is starting';
      throw new HealthCheckError(
        exMessage,
        this.getStatus(key, false, {
          message: exMessage,
        }),
      );
    }
    if (Date.now() - this._lastHeartbeat < this._sessionTimeout) {
      return this.getStatus(key, true, null);
    }

    // Consumer has no heartbeat, but maybe it's because the group is currently rebalancing
    try {
      const { state } = await this._consumer.describeGroup();
      const isHealthy = ['CompletingRebalance', 'PreparingRebalance'].includes(
        state,
      );
      return this.getStatus(key, isHealthy, null);
    } catch (ex) {
      throw new HealthCheckError(
        ex.message,
        this.getStatus(key, false, {
          message: ex.message,
        }),
      );
    }
  }
}
