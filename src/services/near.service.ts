import { Account, connect, KeyPair, Near } from 'near-api-js';
import { KeyStore } from 'near-api-js/lib/key_stores';
import { nearConnectionConfigs, nearNetworkId } from '../configs/near.config';
import { LoggerService } from './logger.service';
import { deriveWorkerAccount } from '../utils/agent';
import { liquidityPoolVaultContract } from 'src/configs/intents.config';

export class NearService {
  private near!: Near;
  private keyStore!: KeyStore;
  private account!: Account;
  private publicKey!: string;

  private viewers!: Account[];

  private logger = new LoggerService('near');

  public async init(): Promise<void> {
    this.logger.info(`Using Near RPC nodes: ${nearConnectionConfigs.map((config) => config.nodeUrl).join(', ')}`);
    this.near = await connect(nearConnectionConfigs[0]);
    this.keyStore = this.near.config.keyStore;

    const { accountId, publicKey, secretKey: privateKey } = await deriveWorkerAccount();

    const keyPair = KeyPair.fromString(privateKey);
    await this.keyStore.setKey(nearNetworkId, accountId, keyPair);
    this.account = await this.near.account(accountId);
    this.publicKey = publicKey;

    // alternative connection config for view functions for cross-checking results
    this.viewers = await Promise.all(nearConnectionConfigs.map(async (config) => {
      const near = await connect(config);
      return near.account(accountId);
    }));
    if (this.viewers.length < 2) {
      throw new Error('Not enough Near RPC nodes to cross-check results');
    }
  }

  public getSigner(): Account {
    return this.account;
  }

  public getSignerId(): string {
    return this.account.accountId;
  }

  public getSignerPublicKey(): string {
    return this.publicKey;
  }

  public getLiquidityPoolVaultId(): string {
    return liquidityPoolVaultContract;
  }

  public async validatedViewFunction({ contractId, methodName, args }: { contractId: string, methodName: string, args: object | undefined }) {
    const results = await Promise.all(this.viewers.map(async (viewer) => {
      return viewer.viewFunction({
        contractId,
        methodName,
        args,
      });
    }));
    if (results.every((result) => result === results[0])) {
      return results[0];
    }
    throw new Error('View function results mismatch');
  }

  public async signMessage(message: Uint8Array) {
    return (await this.keyStore.getKey(nearNetworkId, this.getSignerId())).sign(message);
  }

  /**
   * Gets the balance of the NEAR account
   * @returns {Promise<string>} Account balance
   */
  public async getBalance() {
    let balance = '0';
    try {
      const { available } = await this.account.getAccountBalance();
      balance = available;
    } catch (e: unknown) {
      if (e instanceof Error && 'type' in e && e.type === 'AccountDoesNotExist') {
        // this.logger.info(e.type);
      } else {
        this.logger.error(e instanceof Error ? e.toString() : String(e));
      }
    }
    return balance;
  }
}
