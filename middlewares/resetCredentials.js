const {Users, Settings} = require("@models");

module.exports = async (req, res) => {
        if(req.auth.isAuthenticated){
            let credentials = await Users.findOne(
                {_id: req.auth.credentials._id}
                ).lean();
            const settings = await Settings.findOne({}).lean();

            credentials.position=credentials.scope[0];
            credentials.company_name=settings.name;
            credentials.type=settings.type;
            await req.cookieAuth.clear();
            await req.cookieAuth.set(credentials);
        }
}