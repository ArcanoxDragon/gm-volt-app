import * as React from "react";
import * as volt from "gm-volt";
import {
    AsyncStorage,
    Button,
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

export class GMVoltAndroidApp extends React.Component<Props, State> {
    constructor() {
        super();

        this.state = {
            loading: true,
            username: "",
            password: ""
        };
    }

    componentWillMount(): void {
        ( async () => {
            await volt.init();
            let credentials = await getCredentials();

            if ( credentials ) {} else {
                this.setState( { loading: false } );
            }
        } )();
    }

    async onBtnLogin() {
        let {
            username,
            password
        } = this.state;

        this.setState( { loading: true } );

        if ( username.trim().length === 0 || password.trim().length === 0 ) return;

        let credentials = { username, password } as volt.Credentials;

        await AsyncStorage.setItem( "@volt:username", username );
        await AsyncStorage.setItem( "@volt:password", password );

        await volt.login( credentials );
    }

    render() {
        let {
            loading,
            username,
            password
        } = this.state;

        let btnDisabled = ( username.trim().length === 0 || password.trim().length === 0 );

        return (
            <View style={styles.app}>
                <Text style={styles.title}>Volt Status</Text>
                <View style={styles.credentials}>
                    {loading
                         ? <Text style={styles.label}>Please wait...</Text>
                         : <View>
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
                                           onPress={() => { this.onBtnLogin() }}
                                           title={"Login"}/>
                               </View>
                           </View>}
                </View>
            </View>
        );
    }
}

type StyleSheet = { [ key: string ]: ViewStyle }
const textColor = "#FCFCFC";
const styles = StyleSheet.create( {
    app: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#203035"
    },
    button: {
        marginTop: 8
    },
    credentials: {
        backgroundColor: "rgba( 255, 255, 255, 0.25 )",
        borderRadius: 3,
        marginTop: 8,
        padding: 16,
        width: "75%"
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
    },
} as StyleSheet );