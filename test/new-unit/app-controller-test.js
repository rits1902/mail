define(function(require) {
    'use strict';

    var controller = require('js/app-controller'),
        EmailDAO = require('js/dao/email-dao'),
        DeviceStorageDAO = require('js/dao/devicestorage-dao'),
        $ = require('jquery'),
        expect = chai.expect;

    var appControllerTest = {
        user: 'test@exmaple.com',
        passphrase: 'asdf'
    };

    describe('App Controller unit tests', function() {

        beforeEach(function() {
            sinon.stub(controller, 'login', function(userId, password, token, callback) {
                controller._emailDao = sinon.createStubInstance(EmailDAO);
                callback();
            });

            sinon.stub($, 'get');
            sinon.stub($, 'ajax').yieldsTo('success', {
                email: appControllerTest.user
            });

            window.chrome = window.chrome || {};
            window.chrome.identity = window.chrome.identity || {};
            if (typeof window.chrome.identity.getAuthToken !== 'function') {
                window.chrome.identity.getAuthToken = function() {};
            }
            sinon.stub(window.chrome.identity, 'getAuthToken');
            window.chrome.identity.getAuthToken.yields('token42');
        });

        afterEach(function() {
            controller.login.restore();
            $.get.restore();
            $.ajax.restore();
            window.chrome.identity.getAuthToken.restore();
        });

        describe('start', function() {
            it('should not explode', function(done) {
                controller.start(function(err) {
                    expect(err).to.not.exist;
                    done();
                });
            });
        });

        describe('login', function() {
            it('should work the first time', function(done) {
                // clear db
                var deviceStorage = new DeviceStorageDAO();
                deviceStorage.init('app-config', function() {
                    deviceStorage.clear(function() {

                        // do test with fresh db
                        controller.fetchOAuthToken(appControllerTest.passphrase, function(err, userId) {
                            expect(err).to.not.exist;
                            expect(userId).to.equal(appControllerTest.user);
                            expect(window.chrome.identity.getAuthToken.calledOnce).to.be.true;
                            expect($.ajax.calledOnce).to.be.true;
                            done();
                        });
                    });
                });
            });

            it('should work when the email address is cached', function(done) {
                controller.fetchOAuthToken(appControllerTest.passphrase, function(err, userId) {
                    expect(err).to.not.exist;
                    expect(userId).to.equal(appControllerTest.user);
                    expect(window.chrome.identity.getAuthToken.calledOnce).to.be.true;
                    expect($.ajax.called).to.be.false;
                    done();
                });
            });
        });

    });

});