import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { Link } from 'react-router';
import {
  Button, FormGroup, Row, OverlayTrigger, Tooltip,
} from 'react-bootstrap';
import cookies from '../utils/cookies';
import {
  cordovaDot, historyPush, isCordova, isWebApp,
} from '../utils/cordovaUtils';
import AnalyticsActions from '../actions/AnalyticsActions';
import validateEmail from '../utils/email-functions';
import FacebookStore from '../stores/FacebookStore';
import FacebookActions from '../actions/FacebookActions';
import { oAuthLog, renderLog } from '../utils/logging';
import OpenExternalWebSite from '../utils/OpenExternalWebSite';
import VoterActions from '../actions/VoterActions';
import VoterConstants from '../constants/VoterConstants';
import VoterStore from '../stores/VoterStore';
import webAppConfig from '../config';

export default class Intro extends Component {
  static propTypes = {
    location: PropTypes.object,
  };

  constructor (props) {
    super(props);
    this.state = {
      newsletter_opt_in_true: false,
      voter: {},
      // is_verification_email_sent: false, // Commented out below
      showFeaturesBallot: false,
      showFeaturesOrganizations: false,
      showFeaturesPositions: false,
      showFeaturesNetwork: false,
      showFeaturesVision: false,
      showFeaturesVote: false,
      facebook_friends_image_width: 60,
      facebook_friends_image_height: 60,
      maximum_friends_display: 5,
      facebook_friends_using_we_vote_list: FacebookStore.facebookFriendsUsingWeVoteList(),
      submit_enabled: false,
      voter_email_address: '',
      voter_full_name: '',
    };

    this._toggleBallotFeature = this._toggleBallotFeature.bind(this);
    this._toggleOrganizationsFeature = this._toggleOrganizationsFeature.bind(this);
    this._togglePositionsFeature = this._togglePositionsFeature.bind(this);
    this._toggleNetworkFeature = this._toggleNetworkFeature.bind(this);
    this._toggleVisionFeature = this._toggleVisionFeature.bind(this);
    this._toggleVoteFeature = this._toggleVoteFeature.bind(this);
  }

  static getProps () {
    return {};
  }

  componentDidMount () {
    this.onVoterStoreChange();
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
    AnalyticsActions.saveActionWelcomeVisit(VoterStore.electionId());
    FacebookActions.facebookFriendsAction();
    this.onFacebookStoreChange();
    this.facebookStoreListener = FacebookStore.addListener(this.onFacebookStoreChange.bind(this));
    const weVoteBrandingOffFromUrl = this.props.location.query ? this.props.location.query.we_vote_branding_off : 0;
    const weVoteBrandingOffFromCookie = cookies.getItem('we_vote_branding_off');
    this.setState({
      we_vote_branding_off: weVoteBrandingOffFromUrl || weVoteBrandingOffFromCookie,
    });
  }

  componentWillUnmount () {
    this.voterStoreListener.remove();
    this.facebookStoreListener.remove();
  }

  onFacebookStoreChange () {
    this.setState({
      facebook_friends_using_we_vote_list: FacebookStore.facebookFriendsUsingWeVoteList(),
    });
  }

  onVoterStoreChange () {
    // console.log('is_verification_email_sent:  ' + VoterStore.isVerificationEmailSent());
    this.setState({
      newsletter_opt_in_true: VoterStore.getNotificationSettingsFlagState(VoterConstants.NOTIFICATION_NEWSLETTER_OPT_IN),

      // is_verification_email_sent: VoterStore.isVerificationEmailSent(),
      voter: VoterStore.getVoter(),
    });
  }

  voterEmailAddressSignUpSave = (event) => {
    // Only proceed after we have a valid email address, which will enable the submit
    if (this.state.submit_enabled) {
      event.preventDefault();
      const sendLinkToSignIn = true;
      VoterActions.voterEmailAddressSave(this.state.voter_email_address, sendLinkToSignIn);
      VoterActions.voterFullNameSoftSave('', '', this.state.voter_full_name);
      VoterActions.voterUpdateNotificationSettingsFlags(VoterConstants.NOTIFICATION_NEWSLETTER_OPT_IN);
    }
  }

  _toggleBallotFeature () {
    const { showFeaturesBallot } = this.state;
    this.setState({ showFeaturesBallot: !showFeaturesBallot });
  }

  _toggleOrganizationsFeature () {
    const { showFeaturesOrganizations } = this.state;
    this.setState({ showFeaturesOrganizations: !showFeaturesOrganizations });
  }

  _togglePositionsFeature () {
    const { showFeaturesPositions } = this.state;
    this.setState({ showFeaturesPositions: !showFeaturesPositions });
  }

  _toggleNetworkFeature () {
    const { showFeaturesNetwork } = this.state;
    this.setState({ showFeaturesNetwork: !showFeaturesNetwork });
  }

  _toggleVisionFeature () {
    const { showFeaturesVision } = this.state;
    this.setState({ showFeaturesVision: !showFeaturesVision });
  }

  _toggleVoteFeature () {
    const { showFeaturesVote } = this.state;
    this.setState({ showFeaturesVote: !showFeaturesVote });
  }

  goToGetStarted () {
    // Link to onboarding sequence: /wevoteintro/network
    const getStartedNow = '/ballot';
    historyPush(getStartedNow);
  }

  updateVoterFullName (event) {
    this.setState({
      voter_full_name: event.target.value,
    });
  }

  updateVoterEmailAddress (event) {
    const isEmailValid = validateEmail(event.target.value);
    let submitEnabled = false;
    if (isEmailValid) {
      submitEnabled = true;
    }

    this.setState({
      voter_email_address: event.target.value,
      submit_enabled: submitEnabled,
    });
  }

  shareToFacebookButton () {
    const api = isWebApp() ? window.FB : window.facebookConnectPlugin; // eslint-disable-line no-undef
    api.ui({
      display: 'popup',
      redirect_uri: `${webAppConfig.WE_VOTE_HOSTNAME}/welcome`,
      method: 'share',
      mobile_iframe: true,
      href: webAppConfig.WE_VOTE_HOSTNAME,
      quote: 'I am getting ready to vote at We Vote. Join me! https://WeVote.US #Vote #WeVote',
    }, (response) => {
      if (response === undefined || response.error_code === 4201) {
        console.log('Voter Canceled the share request');
      } else if (response) {
        oAuthLog('Successfully Shared', response);
      }
    });
  }

  render () {
    renderLog(__filename);
    let actualFullName = '';
    let isVoterSignedIn = false;
    const mailToUrl = 'mailto:?subject=Check out We Vote&body=I am using We Vote to discuss what is on my ballot. You can see it at https://WeVote.US too.';
    if (this.state.voter) {
      isVoterSignedIn = this.state.voter.is_signed_in;
      if (this.state.voter.first_name || this.state.voter.last_name) {
        actualFullName = this.state.voter.full_name;
        if (actualFullName.startsWith('voter')) {
          actualFullName = '';
        }
      }
    }

    let pleaseShareString = 'Please share or donate to help us reach more voters.';
    if (isCordova()) {
      pleaseShareString = 'Please share to help us reach more voters.';
    }

    const ballotBaseUrl = 'https://WeVote.US/welcome';
    const encodedMessage = encodeURIComponent('I am getting ready to vote @WeVote. Join me!');
    const twitterIntent = `https://twitter.com/intent/tweet?url=${encodeURIComponent(ballotBaseUrl)}&text=${encodedMessage}&hashtags=Voting,WeVote`;

    let localCounter = 0;
    const facebookFriendsUsingWeVoteListForDisplay = this.state.facebook_friends_using_we_vote_list.map(
      (friend) => {
        localCounter++;
        if (friend.facebook_profile_image_url_https && localCounter <= this.state.maximum_friends_display) {
          const friendName = friend.facebook_user_name ? <Tooltip id="tooltip">{friend.facebook_user_name}</Tooltip> : <span />;
          return (
            <OverlayTrigger key={friend.facebook_user_id} placement="bottom" overlay={friendName}>
              <img
                className="friends-list__welcome-image"
                src={friend.facebook_profile_image_url_https}
                height={this.state.facebook_friends_image_height}
                width={this.state.facebook_friends_image_width}
              />
            </OverlayTrigger>
          );
        } else {
          return null;
        }
      },
    );

    // && this.state.is_verification_email_sent ?
    // urls in css are problematic in cordova
    return (
      <div className="welcome-page">
        <Helmet title="Welcome to We Vote" />
        <section className="hero__section__container">
          <div className="hero__section" style={isCordova() ? { backgroundImage: 'url(./img/welcome/header-image-desktop.png)' } : null}>
            <div className="container">
              <Row bsPrefix="hero__section__row">
                <div className="col-md-12">
                  {/* Mobile View */}
                  <Row bsPrefix="d-block d-sm-none">
                    <h1 className="col-sm-12 u-f1 u-stack--md">
                      View your ballot.
                      <br />
                      Learn from friends.
                      <br />

                      { this.state.facebook_friends_using_we_vote_list.length > 0 ? (
                        <div className="u-flex-row friends-list__welcome">
                          { facebookFriendsUsingWeVoteListForDisplay }
                        </div>
                      ) : null
                      }
                      <section className="quick-links__section--mobile u-flex">
                        {/* Link to onboarding sequence: /wevoteintro/network */}
                        <a className="quick-links__button quick-links__button--left" onClick={() => historyPush('/ballot')}>Get Started</a>
                      </section>

                      <div className="share-your-vision__h1">
                        Share your vision.

                        <section className="quick-links__section--mobile u-flex">
                          {/* When we want to bring this link back to internal:
                            <a className="quick-links__button quick-links__button--right" onClick={() => historyPush('/voterguidegetstarted')}>Enter Voter Guide</a> */}
                          <OpenExternalWebSite
                            url="https://api.wevoteusa.org/vg/create/"
                            className="quick-links__button quick-links__button--right"
                            target="_blank"
                            title="Enter Voter Guide"
                            body={<span>Enter Voter Guide</span>}
                          />
                        </section>
                      </div>
                    </h1>
                  </Row>
                  {/* Desktop View */}
                  <Row bsPrefix="d-none d-sm-flex">
                    <h1 className="col-md-6 u-f1 u-stack--lg">
                      View your ballot.
                      <br />
                      Learn from friends.
                      { this.state.facebook_friends_using_we_vote_list.length > 0 ? (
                        <div className="u-flex-row friends-list__welcome">
                          { facebookFriendsUsingWeVoteListForDisplay }
                        </div>
                      ) : null
                      }
                      <section className="quick-links__section--desktop u-flex">
                        {/* Link to onboarding sequence: /wevoteintro/network */}
                        <a className="quick-links__button quick-links__button--left" onClick={() => historyPush('/ballot')}>Get Started</a>
                      </section>
                    </h1>

                    <h1 className="col-md-6 u-f1 u-stack--lg">
                    Share your vision.
                      <br />
                      {' '}
                      <br />
                      <section className="quick-links__section--desktop u-flex">
                        {/* When we want to bring this link back to internal:
                            <a className="quick-links__button quick-links__button--right" onClick={() => historyPush('/voterguidegetstarted')}>Enter Voter Guide</a> */}
                        <OpenExternalWebSite
                              url="https://api.wevoteusa.org/vg/create/"
                              className="quick-links__button quick-links__button--right"
                              target="_blank"
                              title="Enter Voter Guide"
                              body={<span>Enter Voter Guide</span>}
                        />
                      </section>
                    </h1>
                  </Row>
                </div>
              </Row>
            </div>
          </div>
        </section>

        {/* Sign up for email list */}
        { isVoterSignedIn ?
          null : (
            <section className="form__section">
              <div className="container">
                <Row>
                  <div className="col-md-12">
                    { this.state.we_vote_branding_off ? null : (
                      <span>
                        { this.state.newsletter_opt_in_true ?
                          <h1 className="form__email-verfication u-f1 u-bold u-tc u-stack--lg">Please check your email for a verification link.</h1> : (
                            <div className="form__container">
                              <h2 className="form__header">Sign up to get updates about We Vote.</h2>

                              <form className="row form-inline" onSubmit={this.voterEmailAddressSignUpSave}>
                                <FormGroup bsPrefix="col-md-4">
                                  <label className="sr-only" htmlFor="name">Name</label>
                                  <input
                                    className="form-control"
                                    type="text"
                                    name="voter_full_name"
                                    id=""
                                    value={this.state.voter_full_name}
                                    onChange={this.updateVoterFullName.bind(this)}
                                    placeholder="Name"
                                  />
                                </FormGroup>
                                <FormGroup bsPrefix="col-md-4">
                                  <label className="sr-only" htmlFor="exampleEmail">Email</label>
                                  <input
                                    className="form-control"
                                    type="email"
                                    name="voter_email_address"
                                    id=""
                                    value={this.state.voter_email_address}
                                    onChange={this.updateVoterEmailAddress.bind(this)}
                                    placeholder="Email Address"
                                  />
                                </FormGroup>
                                <FormGroup bsPrefix="col-md-4">
                                  {this.state.submit_enabled ? (
                                    <Button
                                      bsPrefix="form-control"
                                      variant="success"
                                      type="submit"
                                      onClick={this.voterEmailAddressSignUpSave}
                                    >
                                      Sign Up
                                    </Button>
                                  ) : (
                                    <Button
                                      bsPrefix="form-control form__button--disabled"
                                      variant="success"
                                      type="submit"
                                      disabled
                                      onClick={this.voterEmailAddressSignUpSave}
                                    >
                                      Enter Your Email
                                    </Button>
                                  )}
                                </FormGroup>
                              </form>
                            </div>
                          )
                        }
                      </span>
                    )
                    }
                  </div>
                </Row>
              </div>
            </section>
          )
        }

        {/* Description of benefits of We Vote */}
        <section className="features__section">
          <div className="container">
            <Row>
              <div className="col-sm-12 col-md-12 col-lg-12 u-flex u-justify-center features__block__container">
                <div className="features-your-mission__block">
                  <div className="features__title">
                    Your Mission:
                    <br />
                    <span className="d-none d-sm-block h2">Vote your values to make the world a better place.</span>
                    <span className="d-block d-sm-none h4">Make the world a better place.</span>
                  </div>
                </div>
              </div>
              <div className="col-sm-12 col-md-4 u-flex u-justify-center features__block__container">
                {/* <div className="features__block features__block__row1" onClick={this._toggleBallotFeature}> */}
                <div className="features__block features__block__row1">
                  <Link to="/wevoteintro/network">
                    {/* <img className={this.state.showFeaturesBallot ? "d-none d-sm-block features__image" : "features__image"} src={cordovaDot('/img/welcome/benefits/view-your-ballot.svg')} width="55%" /> */}
                    <img className="features__image" src={cordovaDot('/img/welcome/benefits/view-your-ballot.svg')} width="55%" />
                    <h3 className="features__h3">View Your Ballot</h3>
                    {/* <p className={this.state.showFeaturesBallot ? "features__p" : "features__p d-none d-sm-block"}>See your actual ballot, including candidates and measures.</p> */}
                    <p className="features__p">See your actual ballot, including candidates and measures.</p>
                  </Link>
                </div>
              </div>
              <div className="col-sm-12 col-md-4 u-flex u-justify-center features__block__container">
                <div className="features__block features__block__row1a" onClick={this._toggleOrganizationsFeature}>
                  <Link to="/more/network/issues">
                    {/* <img className={this.state.showFeaturesOrganizations ? "d-none d-sm-block features__image" : "features__image"} src={cordovaDot("/img/welcome/benefits/learn-issues-orgs.svg")} width="60%" /> */}
                    <img className="features__image" src={cordovaDot('/img/welcome/benefits/learn-issues-orgs.svg')} width="60%" />
                    <h3 className="features__h3">Learn From Issues and Organizations</h3>
                    {/* <p className={this.state.showFeaturesOrganizations ? "features__p" : "features__p d-none d-sm-block"}>Follow the issues and Listen to the voter guides of groups you trust. See what they support or oppose.</p> */}
                    <p className="features__p">Follow the issues and Listen to the voter guides of groups you trust. See what they support or oppose.</p>
                  </Link>
                </div>
              </div>
              <div className="col-sm-12 col-md-4 u-flex u-justify-center features__block__container">
                <div className="features__block features__block__row2" onClick={this._togglePositionsFeature}>
                  <Link to="/ballot">
                    <img className={this.state.showFeaturesPositions ? 'd-none d-sm-block features__image' : 'features__image'} src={cordovaDot('/img/welcome/benefits/network-position.svg')} />
                    <h3 className="features__h3">See Your Network&apos;s Positions</h3>
                    {/* <p className={this.state.showFeaturesPositions ? "features__p" : "features__p d-none d-sm-block"}>See how many in your network support or oppose each candidate or measure.</p> */}
                    <p className="features__p">See how many in your network support or oppose each candidate or measure.</p>
                  </Link>
                </div>
              </div>
              <div className="col-sm-12 col-md-4 u-flex u-justify-center features__block__container">
                <div className="features__block features__block__row2a" onClick={this._toggleNetworkFeature}>
                  <Link to="/more/network/friends">
                    <img className={this.state.showFeaturesNetwork ? 'd-none d-sm-block features__image' : 'features__image'} src={cordovaDot('/img/welcome/benefits/choose-friends.svg')} width="60%" />
                    <h3 className="features__h3">Invite Friends to Your We Vote Network</h3>
                    {/* <p className={this.state.showFeaturesNetwork ? "features__p" : "features__p d-none d-sm-block"}>Talk politics with friends who share your values. Avoid flame wars!</p> */}
                    <p className="features__p">Talk politics with friends who share your values. Avoid flame wars!</p>
                  </Link>
                </div>
              </div>
              <div className="col-sm-12 col-md-4 u-flex u-justify-center features__block__container">
                <div className="features__block features__block__row3" onClick={this._toggleVisionFeature}>
                  <Link to="/voterguidegetstarted">
                    <img className={this.state.showFeaturesVision ? 'd-none d-sm-block features__image' : 'features__image'} src={cordovaDot('/img/welcome/benefits/share-vision.svg')} width="55%" />
                    <h3 className="features__h3">Share Your Vision</h3>
                    {/* <p className={this.state.showFeaturesVision ? "features__p" : "features__p d-none d-sm-block"}>Empower other voters with what you&apos;ve learned. Help your friends.</p> */}
                    <p className="features__p">Empower other voters with what you&apos;ve learned. Help your friends.</p>
                  </Link>
                </div>
              </div>
              <div className="col-sm-12 col-md-4 u-flex u-justify-center features__block__container">
                <div className="features__block features__block__row3a" onClick={this._toggleVoteFeature}>
                  <Link to="/wevoteintro/network">
                    <img className={this.state.showFeaturesVote ? 'd-none d-sm-block features__image' : 'features__image'} src={cordovaDot('/img/welcome/benefits/decide.svg')} width="60%" />
                    <h3 className="features__h3">Decide & Vote</h3>
                    {/* <p className={this.state.showFeaturesVote ? "features__p" : "features__p d-none d-sm-block"}>Cast your vote with confidence after using We Vote.</p> */}
                    <p className="features__p">Cast your vote with confidence after using We Vote.</p>
                  </Link>
                </div>
              </div>
            </Row>
            <Button className="quick-links__button quick-links__button--left" variant="danger" size="large" bsPrefix="u-stack--md center-block" onClick={this.goToGetStarted}>Get Started</Button>
          </div>
        </section>

        {/* We Vote Partners */}
        { this.state.we_vote_branding_off ? null : (
          <section className="network__section">
            <div className="container">
              <h2 className="u-f2 u-stack--lg">Our Network</h2>
              <div className="partner__logos">
                <img className="partner-logo u-push--lg u-stack--lg" src={cordovaDot('/img/welcome/partners/google-logo.svg')} alt="Google" width="150" />
                <img className="partner-logo u-push--lg u-stack--lg" src={cordovaDot('/img/welcome/partners/center-for-technology.png')} alt="Center for Technology and Civic Life" width="200" />
                <img className="partner-logo u-push--lg u-stack--lg" src={cordovaDot('/img/welcome/partners/vote-org.png')} alt="Vote.org" width="169" />
                <img className="partner-logo u-push--lg u-stack--lg" src={cordovaDot('/img/welcome/partners/voting-information-project.png')} alt="Voting Information Project" width="193" />
              </div>
            </div>
          </section>
        )
        }

        {/* Dark blue section with share buttons and footer links */}
        <section className="footer__section">
          <div className="container">
            { this.state.we_vote_branding_off ? null : (
              <span>
                <h3 className="u-f3 u-stack--lg">{pleaseShareString}</h3>
                <div className="u-stack--lg">
                  <Button
                    bsPrefix="btn btn-social btn-facebook u-push--sm"
                    variant="danger"
                    type="submit"
                    onClick={this.shareToFacebookButton}
                  >
                    <span className="fa fa-facebook" />
                    {' '}
                    Facebook
                  </Button>
                  <OpenExternalWebSite
                    url={twitterIntent}
                    target="_blank"
                    title="Share to Twitter"
                    body={(
                      <Button
                        bsPrefix="btn btn-social btn-twitter u-push--sm"
                        variant="danger"
                      >
                        <span className="fa fa-twitter" />
                        <span> Twitter</span>
                      </Button>
                    )}
                  />
                  <OpenExternalWebSite
                    url={mailToUrl}
                    target="_blank"
                    title="Submit this to Email"
                    body={(
                      <button className="btn btn-social btn--email u-push--sm" type="button">
                        <span className="fa fa-envelope" />
                        Email
                      </button>
                    )}
                  />
                  <Link to="/more/donate">
                    <button className="btn btn-social btn-danger u-push--sm" type="button">
                      <span className="fa fa-heart" />
                      {' '}
                      Donate
                    </button>
                  </Link>
                </div>

                <ul className="footer-nav u-f4 list-unstyled list-inline u-stack--lg">
                  <li className="u-push--md u-stack--sm">
                    <Link to="/more/about">About</Link>
                  </li>
                  <li className="u-push--md u-stack--sm">
                    {/* Link to onboarding sequence: /wevoteintro/network */}
                    <Link to="/ballot">Get Started</Link>
                  </li>
                  <li className="u-push--md u-stack--sm">
                    <Link to="/settings/account">Sign In</Link>
                  </li>
                  <li className="u-push--md u-stack--sm">
                    <Link to="/more/tools">Tools For Your Website</Link>
                  </li>
                  <li className="u-push--md u-stack--sm">
                    <Link to="/more/elections">Supported Elections</Link>
                  </li>
                  <li className="u-push--md u-stack--sm">
                    <OpenExternalWebSite
                      url="https://blog.wevote.us/"
                      target="_blank"
                      body="We Vote Blog"
                    />
                  </li>
                </ul>
              </span>
            )}

            <div className="u-f--small u-stack--lg">
              <p>
                WeVote.US is brought to you by a partnership between two registered nonprofit organizations, one
                {' '}
                <span className="u-no-break">501(c)(3)</span>
                {' '}
                and one
                {' '}
                <span className="u-no-break">501(c)(4)</span>
                .
                <br />
                We do not support or oppose any political candidate or party.
              </p>
              <p>
                <OpenExternalWebSite
                  url="https://github.com/WeVote"
                  target="_blank"
                  body="The software that powers We Vote is open source and built by volunteers."
                />
              </p>
            </div>

            <ul className="u-tc list-unstyled list-inline">
              <li className="u-push--lg">
                <Link to="/more/privacy">Privacy Policy</Link>
              </li>
              <li className="u-push--lg">
                <Link to="/more/terms">Terms of Use</Link>
              </li>
              <li>
                <OpenExternalWebSite
                  url="https://help.wevote.us/hc/en-us/requests/new"
                  target="_blank"
                  body="Contact"
                />
              </li>
            </ul>

          </div>
        </section>
      </div>
    );
  }
}
