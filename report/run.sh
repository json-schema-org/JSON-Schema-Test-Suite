#!/bin/sh

for d in ../tests/*/
do
    for f in $d* # $d contains the ending /
    do
        echo "$f"
        scenarioIndex=0
        jq -cr '.[]' < $f | while read j
        do
            scenario=$(echo $j | jq '.description')
            schemaUri="$f#/$scenarioIndex/schema"
            caseIndex=0
            echo $j | jq -c '.tests[]' | while read c
            do
                case=$(echo $c | jq '.description')
                instanceUri="$f#/$scenarioIndex/tests/$caseIndex/data"
                valid=$(echo $c | jq '.valid')

                ${1} --schema $schemaUri --instance $instanceUri
                if [[ $? -ne 0 ]]
                then
                    echo "'$scenario' / '$case' : $?"
                fi
#               capture result
                ((caseIndex++))
            done
            ((scenarioIndex++))
        done
    done
done
