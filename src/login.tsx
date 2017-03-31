import { AsyncComponent } from "./asyncComponent";
import * as volt from "gm-volt";
import * as React from "react";

import { Requester } from "./requester";
import {
    AsyncStorage,
    Button,
    Image,
    StyleSheet,
    Text,
    TextInput,
    View,
    ViewStyle
    } from "react-native";

export interface Props {}

export interface State {
    loading: boolean;
    username: string;
    password: string;
    error: string;
    captcha: string;
    captchaId?: string;
    captchaAnswer?: string;
}

async function getCredentials() {
    let username = await AsyncStorage.getItem( "@volt:username" );
    let password = await AsyncStorage.getItem( "@volt:password" );

    if ( !username || !password ) return null;

    return {
        username,
        password
    } as volt.Credentials;
}

async function isLoggedIn(): Promise<boolean> {
    return ( await AsyncStorage.getItem( "@volt:loggedin" ) ) === "true";
}

async function clearLoggedIn(): Promise<void> {
    await AsyncStorage.removeItem( "@volt:loggedin" );
}

export class LoginView extends AsyncComponent<Props, State> {
    static contextTypes = {
        app: React.PropTypes.object
    }

    constructor() {
        super();

        this.state = {
            loading: true,
            username: "",
            password: "",
            error: null,
            captcha: null,
            captchaId: null,
            captchaAnswer: ""
        };
    }

    componentWillMount(): void {
        ( async () => {
            try {
                let r = new Requester();
                await volt.init( r );

                let credentials = await getCredentials();
                let loggedIn = credentials && await isLoggedIn();

                await this.setStateAsync( { ...credentials } );

                if ( loggedIn )
                    await this.doLogin();
                else
                    await this.setStateAsync( { loading: false } );
            } catch ( error ) {
                console.log( "error/componentWillMount:", error );

                await clearLoggedIn();

                this.setState( { loading: false, error } );
            }
        } )();
    }

    async doLogin() {
        let {
            username,
            password,
            captcha,
            captchaAnswer,
            captchaId
        } = this.state;

        try {
            await this.setStateAsync( { captcha: null, loading: true } );

            if ( username.trim().length === 0 || password.trim().length === 0 ) return;

            let credentials = { username, password } as volt.Credentials;

            await AsyncStorage.setItem( "@volt:username", username );
            await AsyncStorage.setItem( "@volt:password", password );

            if ( captcha && captchaAnswer && captchaId ) {
                Object.assign( credentials, {
                    captchaId,
                    captchaAnswer
                } );
            }

            await volt.login( credentials );

            await AsyncStorage.setItem( "@volt:loggedin", "true" );

            this.context.app.changeView( "status" );
        } catch ( error ) {
            if ( error.name === "Captcha" ) {
                await this.setStateAsync( {
                    loading: false,
                    captchaId: error.captchaId,
                    captcha: error.captchaImageContent,
                    captchaAnswer: ""
                } );
            } else {
                console.log( "error/onBtnLogin:", error );

                await clearLoggedIn();

                this.setState( { loading: false, error } );
            }

        }
    }

    render() {
        let {
            error,
            loading,
            username,
            password,
            captcha,
            captchaAnswer
        } = this.state;
        let curViewState = "loading";
        let btnDisabled: boolean;
        let curView: Object;

        if ( error ) curViewState = "error";
        else if ( captcha ) curViewState = "captcha";
        else if ( !loading ) curViewState = "login";

        switch ( curViewState ) {
            case "captcha":
                btnDisabled = captchaAnswer.trim().length === 0;
                curView = <View>
                              <Text style={styles.label}>You must complete the captcha to log in:</Text>
                              <Image style={styles.captcha}
                                     source={{ uri: `data:image/png;base64,${ captcha }` }}/>
                              <TextInput style={styles.input}
                                         onChangeText={captchaAnswer => this.setState( { captchaAnswer } )}
                                         placeholder={"Captcha text"}
                                         value={captchaAnswer}/>
                              <Button disabled={btnDisabled}
                                      onPress={() => { this.doLogin() }}
                                      title={"Login"}/>
                          </View>;
                break;
            case "loading":
                curView = <Text style={styles.label}>Please wait...</Text>;
                break;
            case "login":
                btnDisabled = ( username.trim().length === 0 || password.trim().length === 0 );
                curView = <View>
                              <TextInput style={styles.input}
                                         onChangeText={username => this.setState( { username } )}
                                         placeholder={"Username"}
                                         value={username}/>
                              <TextInput style={styles.input}
                                         onChangeText={password => this.setState( { password } )}
                                         placeholder={"Password"}
                                         secureTextEntry={true}
                                         value={password}/>
                              <View style={styles.button}>
                                  <Button disabled={btnDisabled}
                                          onPress={() => { this.doLogin() }}
                                          title={"Log In"}/>
                              </View>
                          </View>;
                break;
            default:
                curView = <Text style={styles.error}>An error occurred: {error.toString()}</Text>;
                break;
        }

        return ( <View style={styles.view}>
                     <Text style={styles.title}>Volt Status</Text>
                     <View style={styles.credentials}>
                         {curView}
                     </View>
                 </View> );
    }
}

type StyleSheet = { [ key: string ]: ViewStyle }
const textColor = "#FCFCFC";
const styles = StyleSheet.create( {
    view: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#203035"
    },
    button: {
        marginTop: 8
    },
    captcha: {
        backgroundColor: "#ffffff",
        width: 200,
        height: 50
    },
    credentials: {
        backgroundColor: "rgba( 255, 255, 255, 0.25 )",
        borderRadius: 3,
        marginTop: 8,
        padding: 16,
        width: "75%"
    },
    error: {
        color: "#ff4444"
    },
    input: {
        color: textColor
    },
    label: {
        color: textColor
    },
    title: {
        fontSize: 40,
        color: textColor
    }
} as StyleSheet );