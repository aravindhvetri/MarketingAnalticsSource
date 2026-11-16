import * as React from "react";
import styles from "./MarketingAnalytics.module.scss";
import type { IMarketingAnalyticsProps } from "./IMarketingAnalyticsProps";

import { ISPFXContext, sp } from "@pnp/pnpjs";
import MainComponent from "./MainComponents/MainComponents";

export default class MarketingAnalytics extends React.Component<IMarketingAnalyticsProps> {
  constructor(prop: IMarketingAnalyticsProps, state: {}) {
    super(prop);
    sp.setup({
      spfxContext: this.props.context as unknown as ISPFXContext,
    });
  }
  public render(): React.ReactElement<IMarketingAnalyticsProps> {
    return (
      <div>
        <MainComponent context={this.props.context} />
      </div>
    );
  }
}
