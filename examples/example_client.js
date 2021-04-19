import FIXParser, {
    Field,
    Fields,
    Messages,
    Side,
    OrderTypes,
    HandlInst,
    TimeInForce,
    EncryptMethod,
} from '../src/FIXParser'; // from 'fixparser';

const fixParser = new FIXParser();
const SENDER = 'AUSYDUTRC1';
const TARGET = 'AACAPAUETFC';

function sendLogon() {

    fixParser.setNextTargetMsgSeqNum(186);
    console.log(fixParser.isConnected());
    console.log(fixParser.getNextTargetMsgSeqNum());
    const logon = fixParser.createMessage(
        new Field(Fields.BeginString, 'FIXT.1.1'),
        new Field(Fields.MsgType, Messages.Logon),
        new Field(Fields.MsgSeqNum, fixParser.getNextTargetMsgSeqNum()),
        new Field(Fields.SenderCompID, SENDER),
        new Field(Fields.SendingTime, fixParser.getTimestamp()),
        new Field(Fields.TargetCompID, TARGET),
        new Field(Fields.EncryptMethod, EncryptMethod.None),
        new Field(Fields.HeartBtInt, 30),
        new Field(Fields.DefaultApplVerID, 9),
    );
    const messages = fixParser.parse(logon.encode());
    console.log('sending message', messages[0].description, messages[0].string);
    fixParser.send(logon);
    
}

fixParser.connect({
    host: 'localhost',
    port: 9878,
    protocol: 'tcp',
    sender: SENDER,
    target: TARGET,
    fixVersion: 'FIXT.1.1'
});

console.log(fixParser.isConnected());

fixParser.on('open', async () => {
    console.log('Open');

    sendLogon();
    const orderMessage = fixParser.createMessage(
        new Field(Fields.BeginString, 'FIXT.1.1'),
        new Field(Fields.MsgType, Messages.NewOrderSingle),
        new Field(Fields.MsgSeqNum, fixParser.getNextTargetMsgSeqNum()),
        new Field(Fields.SenderCompID, SENDER),
        new Field(Fields.SendingTime, fixParser.getTimestamp()),
        new Field(Fields.TargetCompID, TARGET),
        new Field(Fields.ClOrdID, 'hyguyg78yy7iyhuihx'),
        new Field(Fields.OrderQty, 200),
        new Field(Fields.TransactTime, fixParser.getTimestamp()),
        new Field(Fields.OrdType, OrderTypes.Market),
        new Field(Fields.Side, Side.Buy),
        new Field(Fields.SecurityID, 2800),
        new Field(Fields.SecurityIDSource, 8),
        new Field(Fields.SecurityExchange, 'XHKG'),
        new Field(Fields.Account, '6926'),
        new Field(Fields.NoPartyIDs, 1),
        new Field(Fields.PartyID, 'UTR8'),
        new Field(Fields.PartyIDSource, 'D'),
        new Field(Fields.PartyRole, 11),
        new Field(Fields.Currency, 'HKD'),
        new Field(Fields.NoStrategyParameters, 1),
        new Field(Fields.StrategyParameterName, 'ETFRequestType'),
        new Field(Fields.StrategyParameterType, 12),
        new Field(Fields.StrategyParameterValue, 'K')
      );

    const messages = fixParser.parse(orderMessage.encode());
    console.log('sending message', messages[0].description, messages[0].string);
      fixParser.send(orderMessage);

});
fixParser.on('message', (message) => {
    console.log('received message', message);
});
fixParser.on('close', () => {
    console.log('Disconnected');
});
fixParser.on('error', (error) => {
    console.log(error);
});
