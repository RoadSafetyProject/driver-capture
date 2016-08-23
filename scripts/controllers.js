/* global angular */

'use strict';

/* Controllers */
var appControllers = angular.module('appControllers', ['iroad-relation-modal'])

    .controller('MainController', function (NgTableParams,iRoadModal, $scope,$uibModal,$log) {
        //$scope.offenceEvent = iRoadModal("Offence Event");
        $scope.loading = true;
        $scope.tableParams = new NgTableParams();
        $scope.params ={pageSize:5};

        $scope.params ={pageSize:5};
        $scope.programName = "Driver";

        /**
         * createColumns
         * @param programStageDataElements
         * @returns {Array}
         */
        function createColumns(programStageDataElements) {
            var cols = [];
            if (programStageDataElements){
                programStageDataElements.forEach(function (programStageDataElement) {
                    var filter = {};
                    filter[programStageDataElement.dataElement.name.replace(" ","")] = 'text';
                    cols.push({
                        field: programStageDataElement.dataElement.name.replace(" ",""),
                        title: programStageDataElement.dataElement.name,
                        headerTitle: programStageDataElement.dataElement.name,
                        show: programStageDataElement.displayInReports,
                        sortable: programStageDataElement.dataElement.name.replace(" ",""),
                        filter: filter
                    });
                })
            }
            cols.push({
                field: "",
                title: "Action",
                headerTitle: "Action",
                show: true
            });
            return cols;
        }


        /**
         * getDrivers
         */
        getDrivers();
        function getDrivers(){
            iRoadModal.getAll($scope.programName,$scope.params).then(function(results){
                $scope.tableParams.settings({
                    dataset: results
                });
                $scope.loading = false;
                iRoadModal.getProgramByName($scope.programName).then(function(program){
                    $scope.program = program;
                    $scope.tableCols = createColumns(program.programStages[0].programStageDataElements);

                })
            })
        }

        $scope.showDetails = function(event){
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'views/details.html',
                controller: 'DetailController',
                size: "sm",
                resolve: {
                    event: function () {
                        return event;
                    },
                    program:function(){
                        return $scope.program;
                    }
                }
            });

            modalInstance.result.then(function (resultItem) {
                iRoadModal.setRelations(event).then(function(){

                });
            }, function () {
                iRoadModal.setRelations(event).then(function(){

                });
                $log.info('Modal dismissed at: ' + new Date());
            });
        }
        $scope.showEdit = function(event){
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'views/addedit.html',
                controller: 'EditController',
                size: "lg",
                resolve: {
                    event: function () {
                        return event;
                    },
                    program:function(){
                        return $scope.program;
                    }
                }
            });

            modalInstance.result.then(function (resultEvent) {
                $scope.tableParams.data.forEach(function(event){
                    if(event.event == resultEvent.event){
                        Object.keys(event).forEach(function(key){
                            event[key] = resultEvent[key];
                        })

                    }
                })
                $scope.tableParams.reload();
            }, function () {
                iRoadModal.setRelations(event).then(function(){

                });
                $log.info('Modal dismissed at: ' + new Date());
            });
        }
        $scope.showAddNew = function(){
            var event = {};
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'views/addedit.html',
                controller: 'EditController',
                size: "lg",
                resolve: {
                    event: function () {
                        return event;
                    },
                    program:function(){
                        return $scope.program;
                    }
                }
            });

            modalInstance.result.then(function (resultEvent) {
                $scope.tableParams.data.push(resultEvent);
            }, function () {

            });
        };

        $scope.addRelationData = function(relationName,event){
            iRoadModal.getProgramByName(relationName).then(function(program){
                program.displayName = $scope.program.displayName + " - " + relationName;
                iRoadModal.getRelationshipDataElementByProgram(iRoadModal.refferencePrefix + $scope.programName,program).then(function(dataElement){
                    var relationEvent = {};
                    iRoadModal.initiateEvent(relationEvent,program).then(function(newEvent){
                        newEvent.dataValues.forEach(function(dataValue){
                            if(dataValue.dataElement == dataElement.id){
                                dataValue.value = event.event;
                            }
                        });
                        var modalInstance = $uibModal.open({
                            animation: $scope.animationsEnabled,
                            templateUrl: 'views/addedit.html',
                            controller: 'EditController',
                            size: "lg",
                            resolve: {
                                event: function () {
                                    return newEvent;
                                },
                                program:function(){
                                    return program;
                                }
                            }
                        });
                        modalInstance.result.then(function (resultEvent) {
                            console.log(resultEvent);
                        }, function () {
                            $log.info('Relation Modal dismissed at: ' + new Date());
                        });
                    });
                });
            });
        };

        $scope.viewRelationData = function(relationName,eventId){
            console.log(relationName);
            console.log(eventId);
        };


    })
    .controller('DetailController', function (iRoadModal, $scope,$uibModalInstance,program,event) {
        $scope.loading = true;
        iRoadModal.getRelations(event).then(function(newEvent){
            $scope.event = newEvent;
            $scope.loading = false;
        })
        $scope.program = program;
        $scope.ok = function () {
            $uibModalInstance.close({});
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    })
    .controller('EditController', function (NgTableParams,iRoadModal, $scope,$uibModalInstance,program,event,toaster,DHIS2EventFactory) {
        iRoadModal.initiateEvent(event,program).then(function(newEvent){
            $scope.event = newEvent;
            $scope.loading = false;
            $scope.getDataElementIndex = function(dataElement){
                var index = "";
                $scope.event.dataValues.forEach(function(dataValue,i){
                    if(dataValue.dataElement == dataElement.id){
                        index = i;
                    }
                })
                return index;
            }
        })
        $scope.program = program;

        $scope.save = function () {
            $scope.loading = true;
            iRoadModal.save($scope.event,$scope.program).then(function(result){
                $scope.loading = false;
                $uibModalInstance.close(result);
            },function(error){
                $scope.loading = false;
            });
        };

        $scope.cancel = function () {
            iRoadModal.setRelations($scope.event).then(function(){
                $uibModalInstance.dismiss('cancel');
            })
        };
    })
