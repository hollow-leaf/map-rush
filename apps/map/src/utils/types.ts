import { type Dispatch, type SetStateAction } from 'react'
import { Magic as MagicBase } from 'magic-sdk';
import { OAuthExtension } from '@magic-ext/oauth';
import { FlowExtension } from '@magic-ext/flow';

export type LoginProps = {
  token: string
  setToken: Dispatch<SetStateAction<string>>
}

// Magic Context
export type Magic = MagicBase<OAuthExtension[] & FlowExtension[]>;